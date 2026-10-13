FROM python:3.11-slim
WORKDIR /app
COPY backend/app.py backend/
COPY frontend frontend
ENV ALERTBOT_HOST=0.0.0.0 ALERTBOT_CSV=/datos/resultados.csv TZ=America/Lima
EXPOSE 8765
CMD ["python", "backend/app.py"]
