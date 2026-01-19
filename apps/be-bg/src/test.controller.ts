import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Test')
@Controller('test')
export class TestController {
  @Get()
  @ApiOperation({ summary: 'Test simple' })
  @ApiResponse({ status: 200, description: 'Ça marche !' })
  test() {
    return { message: 'Hello Swagger!' };
  }

  @Get('hello')
  @ApiOperation({ summary: 'Dire bonjour' })
  hello() {
    return { message: 'Bonjour depuis CinePotes!' };
  }
}
