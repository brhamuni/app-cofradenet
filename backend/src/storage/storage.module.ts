import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LocalStorageService } from './local-storage.service';
import { MongoDbStorageService } from './mongodb-storage.service';
import { R2StorageService } from './r2-storage.service';
import { STORAGE_SERVICE } from './storage.interface';

@Module({
    imports: [ConfigModule],
    providers: [
        LocalStorageService,
        MongoDbStorageService,
        R2StorageService,
        {
            provide: STORAGE_SERVICE,
            inject: [
                ConfigService,
                LocalStorageService,
                MongoDbStorageService,
                R2StorageService,
            ],
            useFactory: (
                config: ConfigService,
                local: LocalStorageService,
                mongo: MongoDbStorageService,
                r2: R2StorageService,
            ) => {
                const provider =
                    config.get<string>('MEDIA_STORAGE_PROVIDER') ?? 'local';
                if (provider === 'mongodb') return mongo;
                if (provider === 'r2') return r2;
                return local;
            },
        },
    ],
    exports: [STORAGE_SERVICE],
})
export class StorageModule {}
