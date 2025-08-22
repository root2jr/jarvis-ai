from fastapi import FastAPI
from pydantic import BaseModel
import joblib
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # or your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


clf = joblib.load("intent_model.pkl")
vectorizer = joblib.load("vectorizer.pkl")

class Query(BaseModel):
    text: str
    
@app.post("/predict")
async def identify_intent(data:Query):
    x = vectorizer.transform([data.text])
    prediction = clf.predict(x)[0]
    return {"intent": prediction}