import sys
import joblib

vectorizer = joblib.load("vectorizer.pkl")
clf = joblib.load("intent_model.pkl")
text = sys.argv[1]
vec = vectorizer.transform([text])
pred = clf.predict(vec)

print(pred[0]) 