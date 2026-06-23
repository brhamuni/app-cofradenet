import {
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Injectable,
} from '@nestjs/common';

@Injectable()
export class NotBlockedGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const req: Express.Request = context.switchToHttp().getRequest();
        const user = req.user;
        if (user && (user as unknown as { estaBloqueado?: boolean }).estaBloqueado) {
            const motivo = (user as unknown as { motivoBloqueo?: string }).motivoBloqueo;
            throw new ForbiddenException(
                `Tu cuenta ha sido suspendida. Motivo: ${motivo || 'Incumplimiento de normas'}`,
            );
        }
        return true;
    }
}
