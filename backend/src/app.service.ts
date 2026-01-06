import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
    getHello(): string {
        return 'Estamos en el Backend de CofradeNet!';
    }
}
