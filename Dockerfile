FROM python:3.11.11-slim-bullseye
RUN adduser --system --no-create-home worker
RUN mkdir /amit
WORKDIR /amit
COPY requirements.txt /amit
RUN pip install --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt
COPY . /amit 
VOLUME /amit/data
RUN chown -R worker /amit
LABEL version="0.0.1"
LABEL maintaner="Jerome Mills"
LABEL release-date="2025-02-24"
USER worker
ENV PORT=8286 \
    TIMEZONE="America/Los_Angeles"
EXPOSE ${PORT}
CMD [ "python", "app.py" ]