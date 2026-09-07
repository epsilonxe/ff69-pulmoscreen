"""FastAPI service for PulmoScreen (the FF69 lung-cancer risk model)."""
from __future__ import annotations

import os
from typing import Literal

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from .predictor import Predictor
from .schema import FEATURE_SCHEMA, FIELD_TO_KEY, RISK_BANDS

app = FastAPI(title="PulmoScreen API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.environ.get("WEB_ORIGIN", "http://localhost:3000")],
    allow_methods=["*"],
    allow_headers=["*"],
)

model = Predictor()


class PredictRequest(BaseModel):
    gender: Literal["M", "F"]
    age: int = Field(ge=1, le=120)
    smoking: bool = False
    yellow_fingers: bool = False
    anxiety: bool = False
    peer_pressure: bool = False
    chronic_disease: bool = False
    fatigue: bool = False
    allergy: bool = False
    wheezing: bool = False
    alcohol_consuming: bool = False
    coughing: bool = False
    shortness_of_breath: bool = False
    swallowing_difficulty: bool = False
    chest_pain: bool = False


class PredictResponse(BaseModel):
    label: Literal["YES", "NO"]
    probability: float
    risk: Literal["low", "moderate", "high"]
    threshold: float


@app.get("/health")
def health():
    return {"status": "ok", "model": "elm-lung-cancer",
            "hidden_nodes": model.hidden_nodes}


@app.get("/schema")
def schema():
    return {"fields": FEATURE_SCHEMA, "risk_bands": RISK_BANDS,
            "threshold": model.threshold}


@app.post("/predict", response_model=PredictResponse)
def predict(req: PredictRequest):
    payload = req.model_dump()
    record = {FIELD_TO_KEY[field]: value for field, value in payload.items()}
    return model.predict(record)
