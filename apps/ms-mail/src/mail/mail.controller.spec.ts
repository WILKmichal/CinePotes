import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { MailController } from './mail.controller';
import { MailService } from './mail.service';
import { pageReiniMotDePasse } from './app/page';

jest.mock('./app/page', () => ({
  pageReiniMotDePasse: jest.fn(),
}));

describe('MailController', () => {
  let app: INestApplication;
  let mailService: MailService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MailController],
      providers: [
        {
          provide: MailService,
          useValue: {
            sendEmail: jest.fn(),
            verifyConnection: jest.fn(),
          },
        },
      ],
    }).compile();

    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
    mailService = module.get<MailService>(MailService);
  });

  afterEach(async () => {
    await app.close();
  });

  // POST /mail/send - 200 OK
  it('POST /mail/send - 200 email envoyé avec succès', () => {
    (mailService.sendEmail as jest.Mock).mockResolvedValue(undefined);

    return request(app.getHttpServer())
      .post('/mail/send')
      .send({
        email: 'test@test.com',
        subject: 'Hello',
        content: 'World',
      })
      .expect(200)
      .expect({ message: 'Email envoyé avec succès' });
  });

  // POST /mail/send - 400 email invalide
  it('POST /mail/send - 400 email invalide', () => {
    return request(app.getHttpServer())
      .post('/mail/send')
      .send({
        email: 'invalid-email',
        subject: 'Hello',
        content: 'World',
      })
      .expect(400);
  });

  // POST /mail/send - 400 champs manquants
  it('POST /mail/send - 400 champs manquants', () => {
    return request(app.getHttpServer()).post('/mail/send').send({}).expect(400);
  });

  // POST /mail/send - 500 erreur serveur
  it("POST /mail/send - 500 erreur lors de l'envoi", () => {
    (mailService.sendEmail as jest.Mock).mockRejectedValue(
      new Error("Échec de l'envoi"),
    );

    return request(app.getHttpServer())
      .post('/mail/send')
      .send({
        email: 'test@test.com',
        subject: 'Hello',
        content: 'World',
      })
      .expect(500);
  });

  // GET /mail/health - 200 connexion OK
  it('GET /mail/health - 200 connexion SMTP OK', () => {
    (mailService.verifyConnection as jest.Mock).mockResolvedValue(true);

    return request(app.getHttpServer())
      .get('/mail/health')
      .expect(200)
      .expect({ connected: true, message: 'Connexion SMTP OK' });
  });

  // GET /mail/health - 200 connexion échouée
  it('GET /mail/health - 200 connexion SMTP échouée', () => {
    (mailService.verifyConnection as jest.Mock).mockResolvedValue(false);

    return request(app.getHttpServer())
      .get('/mail/health')
      .expect(200)
      .expect({ connected: false, message: 'Connexion SMTP échouée' });
  });
});

describe('MailController - reset-password (with mocks)', () => {
  let controller: MailController;

  // ✅ mock du service
  const mailServiceMock = {
    sendEmail: jest.fn(),
    verifyConnection: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [MailController],
      providers: [
        {
          provide: MailService,
          useValue: mailServiceMock,
        },
      ],
    }).compile();

    controller = module.get<MailController>(MailController);
  });

  it('doit générer le HTML et appeler sendEmail avec les bons paramètres', async () => {
    // Arrange
    (pageReiniMotDePasse as jest.Mock).mockReturnValue('<p>HTML_RESET</p>');
    mailServiceMock.sendEmail.mockResolvedValue(undefined);

    const body = {
      email: 'test@example.com',
      resetUrl: 'http://localhost:3000/reset-password?token=abc',
      expiresInMinutes: 30,
    };

    // Act
    const result = await controller.resetPassword(body);

    // Assert
    expect(pageReiniMotDePasse).toHaveBeenCalledTimes(1);
    expect(pageReiniMotDePasse).toHaveBeenCalledWith(
      body.resetUrl,
      body.expiresInMinutes,
    );

    expect(mailServiceMock.sendEmail).toHaveBeenCalledTimes(1);
    expect(mailServiceMock.sendEmail).toHaveBeenCalledWith(
      body.email,
      'Réinitialisation de votre mot de passe',
      '<p>HTML_RESET</p>',
    );

    expect(result).toEqual({ message: 'Reset password email envoyé' });
  });

  it('doit propager une erreur si sendEmail échoue', async () => {
    // Arrange
    (pageReiniMotDePasse as jest.Mock).mockReturnValue('<p>HTML_RESET</p>');
    mailServiceMock.sendEmail.mockRejectedValue(new Error('SMTP down'));

    const body = {
      email: 'test@example.com',
      resetUrl: 'http://localhost:3000/reset-password?token=abc',
      expiresInMinutes: 30,
    };

    // Act + Assert
    await expect(controller.resetPassword(body)).rejects.toThrow('SMTP down');
  });
});
