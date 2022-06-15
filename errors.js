class ApplicationError extends Error {
  constructor(message, status) {
    super();

    Error.captureStackTrace(this, this.constructor);

    this.error = true;
    this.name = this.constructor.name;
    this.message = message || "Something went wrong. Please try again.";
    this.status = status || 500;
  }
}

class NotFoundError extends ApplicationError {
  constructor(message) {
    super(message || "Not found.", 404);
  }
}

class BadRequestError extends ApplicationError {
  constructor(message) {
    super(message || "Bad request.", 400);
  }
}

class DoubleSubmitError extends ApplicationError {
  constructor(message) {
    super(message || "Double submit.", 409);
  }
}

class ErrorFactory {
  createError(error) {
    if (error.status == 404 || error.response.status == 404) {
      return new NotFoundError(error.message);
    }
    if (error.status == 400 || error.response.status == 400) {
      return new BadRequestError(error.message);
    }
    if (error.status == 409 || error.response.status == 409) {
      return new DoubleSubmitError(error.message);
    }
    return new ApplicationError(error.message, error.status);
  }
}

module.exports = ErrorFactory;
