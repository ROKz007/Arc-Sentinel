"""One-time training stub for Isolation Forest model.
Run: python app/ml/train.py
"""
import numpy as np
from sklearn.ensemble import IsolationForest
import joblib
from pathlib import Path

MODEL_PATH = Path(__file__).resolve().parent / "model.pkl"


def main():
    healthy_data = np.random.normal(loc=0.5, scale=0.1, size=(500, 2))
    model = IsolationForest(n_estimators=100, contamination=0.05, random_state=42)
    model.fit(healthy_data)
    joblib.dump(model, MODEL_PATH)
    print(f"Saved model to {MODEL_PATH}")


if __name__ == "__main__":
    main()
