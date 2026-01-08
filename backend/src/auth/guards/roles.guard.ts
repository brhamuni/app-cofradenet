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
        // 1. Obtenemos los roles permitidos para esta ruta específica
        const requiredRoles = this.reflector.getAllAndOverride<string[]>(
            'roles',
            [context.getHandler(), context.getClass()],
        );

        // Si la ruta no tiene el decorador @Roles, se permite el acceso
        if (!requiredRoles) {
            return true;
        }

        // 2. Obtenemos el usuario de la request (puesto ahí por el JwtAuthGuard)
        const { user } = context
            .switchToHttp()
            .getRequest<{ user: UsuarioRequest }>();

        // 3. Comprobamos si el rol del usuario está en la lista permitida
        const hasRole = requiredRoles.includes(user.rol);

        if (!hasRole) {
            throw new ForbiddenException(
                'No tienes permisos para acceder a este recurso',
            );
        }

        return true;
    }
}
