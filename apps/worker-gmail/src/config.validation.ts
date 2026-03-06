import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  REDIS_HOST: Joi.string().required(),
  REDIS_PORT: Joi.number().integer().positive().required(),
  SMTP_HOST: Joi.string().required(),
  SMTP_PORT: Joi.number().integer().positive().required(),
  SMTP_USER: Joi.string().email().required(),
  SMTP_PASSWORD: Joi.string().required(),
});
