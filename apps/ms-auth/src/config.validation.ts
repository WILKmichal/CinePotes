import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  APP_PORT: Joi.number().integer().positive().required(),
  NATS_URL: Joi.string().pattern(/^nats:\/\/.+/).required(),
  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().integer().positive().required(),
  DB_USER: Joi.string().required(),
  DB_PASSWORD: Joi.string().required(),
  DB_NAME: Joi.string().required(),
  JWT_SECRET: Joi.string().min(16).required(),
  RESET_PASSWORD_EXPIRES_MINUTES: Joi.number().integer().positive().required(),
  FRONT_RESET_PASSWORD_URL: Joi.string().uri().required(),
  VERIFICATION_MAIL: Joi.string().valid('TRUE', 'FALSE', 'true', 'false').required(),
});