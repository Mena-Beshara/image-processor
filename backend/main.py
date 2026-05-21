"""FastAPI backend for image processing."""
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import Response, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import base64

from processing import validate_image, generate_trials, generate_final

app = FastAPI(title="Image Processor API", version="1.0.0")

# CORS — adjust for production domain
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Replace with your Render frontend URL in prod
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/trials")
async def trials(file: UploadFile = File(...)):
    """Upload image → get 3 trial preview PNGs as base64."""
    try:
        contents = await file.read()
        img = validate_image(contents)
        t1, t2, t3 = generate_trials(img)
        return JSONResponse({
            "trial1": base64.b64encode(t1).decode("utf-8"),
            "trial2": base64.b64encode(t2).decode("utf-8"),
            "trial3": base64.b64encode(t3).decode("utf-8"),
        })
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/final")
async def final(
    file: UploadFile = File(...),
    style: int = Form(...),
    width: int = Form(...),
    height: int = Form(...),
):
    """Upload image + params → get final PNG bytes."""
    if style not in (1, 2, 3):
        raise HTTPException(status_code=400, detail="style must be 1, 2, or 3")
    if width <= 0 or height <= 0:
        raise HTTPException(status_code=400, detail="width and height must be > 0")

    try:
        contents = await file.read()
        img = validate_image(contents)
        png_bytes = generate_final(img, style, width, height)
        return Response(content=png_bytes, media_type="image/png")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
async def health():
    return {"status": "ok"}
