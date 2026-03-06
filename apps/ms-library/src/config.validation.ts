import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NATS_URL: Joi.string().required(),
  REDIS_HOST: Joi.string().required(),
  REDIS_PORT: Joi.number().integer().positive().required(),
  TMDB_API_KEY: Joi.string().required(),
});
