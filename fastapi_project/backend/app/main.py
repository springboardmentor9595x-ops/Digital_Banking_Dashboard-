from fastapi import FastAPI

app = FastAPI(title="Banking Dashboard API")

@app.get("/")
def root():
    return {"message": "Banking Dashboard Backend is running"}
