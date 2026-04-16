"""
KrishiDoot Telegram Bot
Owned by: Person 1

Run with: python -m telegram_bot.bot (from backend/ directory)

Commands:
  /start                      - Welcome + instructions
  /price <crop> <state>       - Today's APMC modal price
  /negotiate <crop> <qty> <location>  - Start a text negotiation
  /help                       - Show commands
"""
import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from telegram import Update
from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes

from config import settings
from services.apmc_api import get_modal_price, compute_batna

# In-memory session store for telegram users
_tg_sessions: dict = {}


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(
        "🌾 Namaste! I am *KrishiDoot.AI* — your digital fiduciary.\n\n"
        "I help you get a fair price at the mandi by negotiating on your behalf.\n\n"
        "*Commands:*\n"
        "/price <crop> <state> — Today's APMC price\n"
        "/negotiate <crop> <qty\\_kg> <mandi> — Start negotiation\n"
        "/help — Show this message\n\n"
        "_Example: /price tomato Karnataka_",
        parse_mode="Markdown"
    )


async def price_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    args = context.args
    if len(args) < 2:
        await update.message.reply_text(
            "Usage: /price <crop> <state>\nExample: /price tomato Karnataka"
        )
        return

    crop = args[0]
    state = " ".join(args[1:])

    await update.message.reply_text(f"Fetching APMC price for {crop.title()} in {state.title()}...")
    try:
        price = await get_modal_price(crop, state)
        batna = compute_batna(price)
        await update.message.reply_text(
            f"📊 *Today's APMC Modal Price*\n\n"
            f"Crop: {crop.title()}\n"
            f"State: {state.title()}\n"
            f"Market Price: ₹{price:.2f}/kg\n"
            f"Your Floor Price (BATNA): ₹{batna:.2f}/kg\n\n"
            f"_Source: data.gov.in APMC Mandi Data_",
            parse_mode="Markdown"
        )
    except ValueError as e:
        await update.message.reply_text(f"❌ {str(e)}")
    except Exception as e:
        await update.message.reply_text(f"❌ Could not fetch price. Error: {str(e)}")


async def negotiate_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    args = context.args
    if len(args) < 3:
        await update.message.reply_text(
            "Usage: /negotiate <crop> <qty_kg> <mandi_location>\n"
            "Example: /negotiate tomato 100 Bengaluru Karnataka"
        )
        return

    crop = args[0]
    try:
        qty = float(args[1])
    except ValueError:
        await update.message.reply_text("Quantity must be a number. Example: /negotiate tomato 100 Bengaluru Karnataka")
        return
    location = " ".join(args[2:])
    state = args[-1]

    try:
        modal_price = await get_modal_price(crop, state)
        batna = compute_batna(modal_price)
        initial_ask = round(modal_price * 1.15, 2)
    except Exception:
        modal_price = 20.0
        batna = compute_batna(modal_price)
        initial_ask = round(modal_price * 1.15, 2)

    user_id = update.effective_user.id
    _tg_sessions[user_id] = {
        "crop": crop, "qty": qty, "location": location,
        "batna": batna, "initial_ask": initial_ask,
        "current_ask": initial_ask, "round": 0
    }

    await update.message.reply_text(
        f"🤝 *Negotiation Started!*\n\n"
        f"Crop: {crop.title()} | Qty: {qty}kg\n"
        f"Market Rate: ₹{modal_price:.2f}/kg\n"
        f"My Opening Ask: ₹{initial_ask:.2f}/kg\n"
        f"My Floor (hidden): ₹{batna:.2f}/kg\n\n"
        f"Now send the buyer's counter-offer as a number.\n"
        f"Example: send *18.5* if buyer offers ₹18.50/kg",
        parse_mode="Markdown"
    )


async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.effective_user.id
    session = _tg_sessions.get(user_id)

    if not session:
        await update.message.reply_text("Send /negotiate to start a negotiation first.")
        return

    try:
        buyer_offer = float(update.message.text.strip())
    except ValueError:
        await update.message.reply_text("Please send a number (the buyer's offer in ₹/kg).")
        return

    batna = session["batna"]
    current_ask = session["current_ask"]

    if buyer_offer >= current_ask:
        del _tg_sessions[user_id]
        await update.message.reply_text(
            f"✅ *Deal Agreed!*\n\n"
            f"Final Price: ₹{buyer_offer:.2f}/kg\n"
            f"Total Value: ₹{buyer_offer * session['qty']:.2f}\n\n"
            f"This is above market rate. Well done! 🎉",
            parse_mode="Markdown"
        )
        return

    if buyer_offer < batna:
        await update.message.reply_text(
            f"❌ Cannot accept ₹{buyer_offer:.2f}/kg — that's below my cost.\n"
            f"My minimum is ₹{batna:.2f}/kg. Try a higher offer."
        )
        return

    session["round"] += 1
    new_ask = round(current_ask - (current_ask - buyer_offer) * 0.1, 2)
    new_ask = max(new_ask, batna)
    session["current_ask"] = new_ask

    await update.message.reply_text(
        f"Counter-offer received: ₹{buyer_offer:.2f}/kg\n"
        f"My new ask: *₹{new_ask:.2f}/kg*\n\n"
        f"The market supports this price. Send your next offer.",
        parse_mode="Markdown"
    )


def run_bot():
    if not settings.TELEGRAM_BOT_TOKEN:
        print("ERROR: TELEGRAM_BOT_TOKEN not set in .env")
        return

    app = Application.builder().token(settings.TELEGRAM_BOT_TOKEN).build()
    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("price", price_command))
    app.add_handler(CommandHandler("negotiate", negotiate_command))
    app.add_handler(CommandHandler("help", start))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))

    print("KrishiDoot Telegram Bot is running. Press Ctrl+C to stop.")
    app.run_polling()


if __name__ == "__main__":
    run_bot()
