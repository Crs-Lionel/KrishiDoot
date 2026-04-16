from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes import negotiation, grading, market_data

app = FastAPI(title="KrishiDoot.AI", version="0.1.0", description="Autonomous negotiation system for Indian farmers")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(negotiation.router, prefix="/negotiate", tags=["negotiation"])
app.include_router(grading.router, prefix="/grade", tags=["grading"])
app.include_router(market_data.router, prefix="/market", tags=["market"])


@app.get("/")
def root():
    return {"status": "KrishiDoot.AI is running", "version": "0.1.0"}
