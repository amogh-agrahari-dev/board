import pytest
from app.main import get_active_universe, check_ticker, app
from fastapi.testclient import TestClient

client = TestClient(app)

def test_get_active_universe_with_custom():
    us_univ = get_active_universe(market="US", custom_tickers=["meta", "aapl", "TATAMOTORS.NS"])
    # "aapl" should not duplicate "AAPL"
    assert "AAPL" in us_univ
    assert us_univ.count("AAPL") == 1
    # "META" should be added and capitalized
    assert "META" in us_univ
    # "TATAMOTORS.NS" should be added
    assert "TATAMOTORS.NS" in us_univ

def test_check_ticker_valid():
    res = client.get("/api/asset/AAPL/check")
    assert res.status_code == 200
    data = res.json()
    assert data["valid"] is True
    assert data["ticker"] == "AAPL"
    assert data["current_price"] > 0

def test_check_ticker_case_insensitive():
    res = client.get("/api/asset/msft/check")
    assert res.status_code == 200
    data = res.json()
    assert data["ticker"] == "MSFT"

def test_screen_with_custom_ticker():
    payload = {
        "risk_tolerance": 3,
        "horizon_months": 1,
        "market": "US",
        "currency": "USD",
        "max_position_size": 0.20,
        "holdings": [],
        "custom_tickers": ["META"]
    }
    res = client.post("/api/screen", json=payload)
    assert res.status_code == 200
    data = res.json()
    tickers = [asset["ticker"] for asset in data["results"]]
    assert "META" in tickers
