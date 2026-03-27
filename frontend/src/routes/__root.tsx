import { lazy, Suspense } from 'react'
import { createRouter, createRootRoute, createRoute, Outlet } from '@tanstack/react-router'
import { z } from 'zod'
import { AuthGuard } from '~/features/member'
import { HostGuard } from '~/features/host'
import { Home } from '~/pages/Home'
import { Login } from '~/pages/Login'
import { Signup } from '~/pages/Signup'
import { CallbackPage } from '~/pages/oauth/CallbackPage'
import { MyBookings } from '~/pages/booking/MyBookings'
import { Detail as BookingDetail } from '~/pages/booking/Detail'
import { Register } from '~/pages/host/Register'
import { TimeSlotSettings } from '~/pages/host/TimeSlotSettings'
import { Settings as HostSettings } from '~/pages/host/Settings'
import { Settings as MemberSettings } from '~/pages/member/Settings'
import { Profile } from '~/pages/host/Profile'
import { Footer } from '~/components/Footer'
import { Terms } from '~/pages/Terms'
import { Privacy } from '~/pages/Privacy'
import { ForgotPassword } from '~/pages/ForgotPassword'
import { Rooms as ChatRooms } from '~/pages/chat/Rooms'
import { ResetPassword } from '~/pages/ResetPassword'

// DevTools는 개발 환경에서만 동적 로드 (프로덕션 빌드 시 tree-shaking으로 완전 제거됨)
// - import.meta.env.DEV는 빌드 시점에 boolean으로 치환되어 dead code elimination 적용
// - 프로덕션 번들에서 router-devtools 코드 미포함 확인됨 (빌드 후 grep 검증 완료)
/* eslint-disable react-refresh/only-export-components */
const TanStackRouterDevtools = import.meta.env.DEV
    ? lazy(() =>
        import('@tanstack/router-devtools').then((mod) => ({
            default: mod.TanStackRouterDevtools,
        }))
    )
    : () => null

/* eslint-enable react-refresh/only-export-components */

const RootRoute = createRootRoute({
    component: () => <>
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
    </>,
})

const homeRoute = createRoute({
    getParentRoute: () => RootRoute,
    path: '/',
    component: Home,
})


const myBookingsRoute = createRoute({
    getParentRoute: () => RootRoute,
    path: '/booking/my-bookings',
    component: () => <AuthGuard><MyBookings /></AuthGuard>,
    validateSearch: z.object({
        page: z.number().min(1).optional().default(() => 1),
        selectedId: z.number().optional(),
    }),
})


const bookingRoute = createRoute({
    getParentRoute: () => RootRoute,
    path: '/booking/$id',
    component: () => <AuthGuard><BookingDetail /></AuthGuard>,
    params: z.object({
        id: z.string().transform<number>((val) => parseInt(val, 10)).pipe(z.number().min(1)),
    }),
})


const loginRoute = createRoute({
    getParentRoute: () => RootRoute,
    path: '/login',
    component: Login,
})

const signupRoute = createRoute({
    getParentRoute: () => RootRoute,
    path: '/signup',
    component: Signup,
})


const hostRegisterRoute = createRoute({
    getParentRoute: () => RootRoute,
    path: '/host/register',
    component: () => <AuthGuard><Register /></AuthGuard>,
})

const hostTimeslotsRoute = createRoute({
    getParentRoute: () => RootRoute,
    path: '/host/timeslots',
    component: () => <HostGuard><TimeSlotSettings /></HostGuard>,
})

const hostSettingsRoute = createRoute({
    getParentRoute: () => RootRoute,
    path: '/host/settings',
    component: () => <HostGuard><HostSettings /></HostGuard>,
})

const hostProfileRoute = createRoute({
    getParentRoute: () => RootRoute,
    path: '/host/$hostId',
    component: Profile,
    params: z.object({
        hostId: z.string(),
    }),
})


const oAuthCallbackRoute = createRoute({
    getParentRoute: () => RootRoute,
    path: '/oauth/callback/$provider',
    component: CallbackPage,
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

const memberSettingsRoute = createRoute({
    getParentRoute: () => RootRoute,
    path: '/member/settings',
    component: () => <AuthGuard><MemberSettings /></AuthGuard>,
})

const chatRoomsRoute = createRoute({
    getParentRoute: () => RootRoute,
    path: '/chat/rooms',
    component: () => <AuthGuard><ChatRooms /></AuthGuard>,
    validateSearch: z.object({
        roomId: z.string().optional(),
        counterpartId: z.string().optional(),
    }),
})

const forgotPasswordRoute = createRoute({
    getParentRoute: () => RootRoute,
    path: '/forgot-password',
    component: ForgotPassword,
})

const resetPasswordRoute = createRoute({
    getParentRoute: () => RootRoute,
    path: '/reset-password',
    component: ResetPassword,
    validateSearch: z.object({
        token: z.string().optional(),
    }),
})

export const routeTree = RootRoute.addChildren([
    homeRoute,

    loginRoute,
    signupRoute,
    myBookingsRoute,
    bookingRoute,
    hostRegisterRoute,
    hostTimeslotsRoute,
    hostSettingsRoute,
    hostProfileRoute,
    oAuthCallbackRoute,
    termsRoute,
    privacyRoute,
    memberSettingsRoute,
    chatRoomsRoute,
    forgotPasswordRoute,
    resetPasswordRoute,
])

export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
    interface Register {
        router: typeof router
    }
}
