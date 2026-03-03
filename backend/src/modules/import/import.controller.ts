import { Controller, Post, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ImportService } from './import.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { memoryStorage } from 'multer';

@UseGuards(JwtAuthGuard)
@Controller('import')
export class ImportController {
  constructor(private service: ImportService) {}

  @Post('sub-recipes')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  importSubRecipes(@UploadedFile() file: Express.Multer.File) {
    return this.service.importSubRecipes(file.buffer);
  }

  @Post('meals')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  importMeals(@UploadedFile() file: Express.Multer.File) {
    return this.service.importMeals(file.buffer);
  }
}
