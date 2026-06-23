import {
    Injectable,
    CanActivate,
    ExecutionContext,
    ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

interface UsuarioRequest {
    userId: number;
    username: string;
    rol: string;
}

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private readonly reflector: Reflector) {}

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.getAllAndOverride<string[]>(
            'roles',
            [context.getHandler(), context.getClass()],
        );

        if (!requiredRoles) {
            return true;
        }

        const { user } = context
            .switchToHttp()
            .getRequest<{ user: UsuarioRequest }>();

        const hasRole = requiredRoles.includes(user.rol);

        if (!hasRole) {
            throw new ForbiddenException(
                'No tienes permisos para acceder a este recurso',
            );
        }

        return true;
    }
}
