import { Controller, Get, Post, Patch, Delete, Body, Param, UseInterceptors, UploadedFile, Res } from '@nestjs/common';
import { AssetService } from './asset.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('asset')
export class AssetController {
  constructor(private readonly assetService: AssetService) {}

  @Get()
  findAll() {
    return this.assetService.findAll();
  }

  @Get('room/:roomId')
  findByRoom(@Param('roomId') roomId: string) {
    return this.assetService.findByRoom(+roomId);
  }

  @Get('stats')
  getStats() {
    return this.assetService.getStats();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.assetService.findOne(+id);
  }

  @Post()
  create(@Body() data: any) {
    return this.assetService.create(data);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: any) {
    return this.assetService.update(+id, data);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.assetService.remove(+id);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads',
      filename: (req, file, cb) => {
        const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
        return cb(null, `${randomName}${extname(file.originalname)}`);
      },
    }),
  }))
  uploadFile(@UploadedFile() file: any) {
    return { 
      url: `/uploads/${file.filename}` 
    };
  }
}
