import { envValidationSchema } from "./config.validation";

describe("envValidationSchema", () => {
  it("accepts a valid environment payload", () => {
    const result = envValidationSchema.validate({
      REDIS_HOST: "localhost",
      REDIS_PORT: "6379",
      SMTP_HOST: "smtp.gmail.com",
      SMTP_PORT: "587",
      SMTP_USER: "test@test.com",
      SMTP_PASSWORD: "password",
    });

    expect(result.error).toBeUndefined();
  });

  it("fails when required variables are missing", () => {
    const result = envValidationSchema.validate({
      REDIS_HOST: "localhost",
      REDIS_PORT: "6379",
    });

    expect(result.error).toBeDefined();
    expect(result.error?.details.some((detail) => detail.path.includes("SMTP_HOST"))).toBe(true);
  });
});
