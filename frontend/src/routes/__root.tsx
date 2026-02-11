import { createRouter, createRootRoute, Outlet, redirect } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import { z } from 'zod'

import {
    createRoute,
} from '@tanstack/react-router'
import Calendar from '../pages/calendar/Calendar'
import { LoginForm, SignupForm } from '~/features/member'
import Home from '~/pages/main/Home'
import MyBookings from '~/pages/calendar/MyBookings'
import Booking from '~/pages/calendar/Booking'
import HostRegisterGuarded from '~/pages/host/HostRegisterGuarded'
import TimeSlotSettingsGuarded from '~/pages/host/TimeSlotSettingsGuarded'
import Footer from '~/components/Footer'
import Terms from '~/pages/legal/Terms'
import Privacy from '~/pages/legal/Privacy'

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
                <TanStackRouterDevtools />
            </>
        )
    },
})

const indexRoute = createRoute({
    getParentRoute: () => RootRoute,
    path: '/',
    beforeLoad: () => {
        throw redirect({ to: '/app' })
    },
})

const homeRoute = createRoute({
    getParentRoute: () => RootRoute,
    path: '/app',
    component: Home,
})


const myBookingsRoute = createRoute({
    getParentRoute: () => RootRoute,
    path: '/app/my-bookings',
    component: MyBookings,
    validateSearch: z.object({
        page: z.number().min(1).optional().default(() => 1),
        pageSize: z.number().min(1).optional().default(() => 10),
    }),
})


const bookingRoute = createRoute({
    getParentRoute: () => RootRoute,
    path: '/app/booking/$id',
    component: Booking,
    params: z.object({
        id: z.string().transform<number>((val) => parseInt(val, 10)).pipe(z.number().min(1)),
    }),
})


const loginRoute = createRoute({
    getParentRoute: () => RootRoute,
    path: '/app/login',
    component: LoginForm,
})

const signupRoute = createRoute({
    getParentRoute: () => RootRoute,
    path: '/app/signup',
    component: SignupForm,
})


const hostRegisterRoute = createRoute({
    getParentRoute: () => RootRoute,
    path: '/app/host/register',
    component: HostRegisterGuarded,
})

const hostTimeslotsRoute = createRoute({
    getParentRoute: () => RootRoute,
    path: '/app/host/timeslots',
    component: TimeSlotSettingsGuarded,
})

const calendarRoute = createRoute({
    getParentRoute: () => RootRoute,
    path: '/app/calendar/$slug',
    component: Calendar,
    params: z.object({
        slug: z.string().min(4),
    }),
    validateSearch: z.object({
        year: z.number().min(2024).optional().default(() => new Date().getFullYear()),
        month: z.number().min(1).max(12).optional().default(() => new Date().getMonth() + 1),
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
    indexRoute,
    homeRoute,
    calendarRoute,
    loginRoute,
    signupRoute,
    myBookingsRoute,
    bookingRoute,
    hostRegisterRoute,
    hostTimeslotsRoute,
    termsRoute,
    privacyRoute,
])

export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
    interface Register {
        router: typeof router
    }
}