import {
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Injectable,
} from '@nestjs/common';

@Injectable()
export class NotBlockedGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const { user } = context.switchToHttp().getRequest();
        if (user && user.estaBloqueado) {
            throw new ForbiddenException(
                `Tu cuenta ha sido suspendida. MOtivo ${user.motivoBloqueo || 'Incumplimiento de normas'}`,
            );
        }
        return true;
    }
}
