from fastapi import FastAPI


app = FastAPI()

@app.get('/', tags=['root'])
async def home():
    return {"message": "Hello world!"}