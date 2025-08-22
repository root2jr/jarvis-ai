import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
import joblib

df = pd.read_csv("intents.csv")

X = df["text"]
y = df["label"]

vectorizer = TfidfVectorizer(ngram_range=(1,2))
X_vec = vectorizer.fit_transform(X)

X_train, X_test, y_train, y_test = train_test_split(X_vec, y, test_size=0.2, random_state=42)

clf = LogisticRegression(max_iter=200, multi_class="multinomial")
clf.fit(X_train, y_train)

y_pred = clf.predict(X_test)

joblib.dump(clf, "intent_model.pkl")
joblib.dump(vectorizer, "vectorizer.pkl")