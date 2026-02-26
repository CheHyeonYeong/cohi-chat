import { lazy, Suspense } from 'react'
import { createRouter, createRootRoute, Outlet } from '@tanstack/react-router'
import { z } from 'zod'

import {
    createRoute,
} from '@tanstack/react-router'
import Calendar from '../pages/calendar/Calendar'
import { LoginForm, SignupForm } from '~/features/member'
import Home from '~/pages/main/Home'
import OAuthCallbackPage from '~/pages/oauth/OAuthCallbackPage'
import MyBookings from '~/pages/calendar/MyBookings'
import Booking from '~/pages/calendar/Booking'
import PasswordResetRequestPage from '~/pages/member/PasswordResetRequestPage'
import PasswordResetConfirmPage from '~/pages/member/PasswordResetConfirmPage'
import HostRegisterGuarded from '~/pages/host/HostRegisterGuarded'
import TimeSlotSettingsGuarded from '~/pages/host/TimeSlotSettingsGuarded'
import Footer from '~/components/Footer'
import Terms from '~/pages/legal/Terms'
import Privacy from '~/pages/legal/Privacy'

// DevTools는 개발 환경에서만 동적 로드 (프로덕션 빌드 시 tree-shaking으로 완전 제거됨)
// - import.meta.env.DEV는 빌드 시점에 boolean으로 치환되어 dead code elimination 적용
// - 프로덕션 번들에서 router-devtools 코드 미포함 확인됨 (빌드 후 grep 검증 완료)
const TanStackRouterDevtools = import.meta.env.DEV
    ? lazy(() =>
        import('@tanstack/router-devtools').then((mod) => ({
            default: mod.TanStackRouterDevtools,
        }))
    )
    : () => null

const RootRoute = createRootRoute({
    component: () => {
        return (
            <>
                <div className="w-full min-h-screen flex flex-col">
                    <div className="flex-1">
                        <Outlet />
                    </div>
                    <Footer />
                </div>
                {/* fallback={null}: DevTools는 필수 UI가 아니므로 로딩 인디케이터 불필요 */}
                <Suspense fallback={null}>
                    <TanStackRouterDevtools />
                </Suspense>
            </>
        )
    },
})

const homeRoute = createRoute({
    getParentRoute: () => RootRoute,
    path: '/',
    component: Home,
})


const myBookingsRoute = createRoute({
    getParentRoute: () => RootRoute,
    path: '/my-bookings',
    component: MyBookings,
    validateSearch: z.object({
        page: z.number().min(1).optional().default(() => 1),
        pageSize: z.number().min(1).optional().default(() => 10),
    }),
})


const bookingRoute = createRoute({
    getParentRoute: () => RootRoute,
    path: '/booking/$id',
    component: Booking,
    params: z.object({
        id: z.string().transform<number>((val) => parseInt(val, 10)).pipe(z.number().min(1)),
    }),
})


const loginRoute = createRoute({
    getParentRoute: () => RootRoute,
    path: '/login',
    component: LoginForm,
})

const signupRoute = createRoute({
    getParentRoute: () => RootRoute,
    path: '/signup',
    component: SignupForm,
})


const passwordResetRoute = createRoute({
    getParentRoute: () => RootRoute,
    path: '/password-reset',
    component: PasswordResetRequestPage,
})

const passwordResetConfirmRoute = createRoute({
    getParentRoute: () => RootRoute,
    path: '/password-reset/confirm',
    component: PasswordResetConfirmPage,
    validateSearch: z.object({
        token: z.string().min(1).optional(),
    }),
})

const hostRegisterRoute = createRoute({
    getParentRoute: () => RootRoute,
    path: '/host/register',
    component: HostRegisterGuarded,
})

const hostTimeslotsRoute = createRoute({
    getParentRoute: () => RootRoute,
    path: '/host/timeslots',
    component: TimeSlotSettingsGuarded,
})

const calendarRoute = createRoute({
    getParentRoute: () => RootRoute,
    path: '/calendar/$slug',
    component: Calendar,
    params: z.object({
        slug: z.string().min(4),
    }),
    validateSearch: z.object({
        year: z.number().min(2024).optional().default(() => new Date().getFullYear()),
        month: z.number().min(1).max(12).optional().default(() => new Date().getMonth() + 1),
    }),
})

const oAuthCallbackRoute = createRoute({
    getParentRoute: () => RootRoute,
    path: '/oauth/callback/$provider',
    component: OAuthCallbackPage,
    validateSearch: z.object({
        code: z.string().optional(),
        error: z.string().optional(),
        state: z.string().optional(),
    }),
})

const termsRoute = createRoute({
    getParentRoute: () => RootRoute,
    path: '/terms',
    component: Terms,
})

const privacyRoute = createRoute({
    getParentRoute: () => RootRoute,
    path: '/privacy',
    component: Privacy,
})

export const routeTree = RootRoute.addChildren([
    homeRoute,
    calendarRoute,
    loginRoute,
    signupRoute,
    passwordResetRoute,
    passwordResetConfirmRoute,
    myBookingsRoute,
    bookingRoute,
    hostRegisterRoute,
    hostTimeslotsRoute,
    oAuthCallbackRoute,
    termsRoute,
    privacyRoute,
])

export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
    interface Register {
        router: typeof router
    }
}