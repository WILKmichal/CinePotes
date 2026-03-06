import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  APP_PORT: Joi.number().integer().positive().required(),
  NATS_URL: Joi.string().required(),
});
