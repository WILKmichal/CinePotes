import { Test, TestingModule } from "@nestjs/testing";
import { AppController } from "./app.controller";
import { MailService } from "./mail.service";
import type { ConfirmEmailDto, ResetPasswordDto } from "@workspace/dtos/notifications";

describe("AppController", () => {
  let controller: AppController;
  let handleConfirmEmail: jest.Mock;
  let handleResetPassword: jest.Mock;

  beforeEach(async () => {
    handleConfirmEmail = jest.fn().mockResolvedValue(undefined);
    handleResetPassword = jest.fn().mockResolvedValue(undefined);

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: MailService,
          useValue: { handleConfirmEmail, handleResetPassword },
        },
      ],
    }).compile();

    controller = module.get<AppController>(AppController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  // On recoit un event NATS confirm-email, on delegue au service
  it("should delegate confirm-email event to MailService", async () => {
    const data: ConfirmEmailDto = {
      email: "user@test.com",
      nom: "Jean",
      confirmUrl: "http://localhost/confirm",
    };

    const mockContext = { getArgs: () => [] } as any;
    await controller.handleConfirmEmail(data, mockContext);

    expect(handleConfirmEmail).toHaveBeenCalledWith(
      "user@test.com",
      "Jean",
      "http://localhost/confirm",
    );
  });

  // Pareil pour reset-password
  it("should delegate reset-password event to MailService", async () => {
    const data: ResetPasswordDto = {
      email: "user@test.com",
      resetUrl: "http://localhost/reset",
      expiresInMinutes: 30,
    };

    const mockContext = { getArgs: () => [] } as any;
    await controller.handleResetPassword(data, mockContext);

    expect(handleResetPassword).toHaveBeenCalledWith(
      "user@test.com",
      "http://localhost/reset",
      30,
    );
  });
});
