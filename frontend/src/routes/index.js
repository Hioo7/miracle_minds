import { createBrowserRouter } from "react-router-dom";
import App from "../App";
// import Home from "../pages/Home";
import Login from "../pages/Login";
import Signup from "../pages/Signup";
import Dashboard from "../pages/Dashboard";
import Welcome from "../pages/Welcome";
import EditProfile from "../pages/EditProfile";
import AdminDashboard from "../pages/AdminDashboard";
import UserManagement from "../pages/Users";
import TimeslotManager from "../pages/TimeslotManager";

import TherapyBooking from "../pages/TherapyBooking";
import AddTherapist from "../pages/AddTherapist";
import TherapyManager from "../pages/TherapyManager";
import CartPage from "../pages/Cart";
import UpcomingMeetingsPage from "../pages/UpcomingMeetingsPage";
import AllOrdersPage from "../pages/AllOrdersPage";
import MeetingPage from "../pages/MeetingPage";
import AdminUpcomingBookingsPage from "../pages/AdminUpcomingBookingsPage";
import AdminAllBookingsPage from "../pages/AdminAllBookingsPage";
import AdminBookingDetailPage from "../pages/AdminBookingDetailPage";
import AdminCreateBookingPage from "../pages/AdminCreateBookingPage";
import ExpertLogin from "../pages/ExpertLogin";
import ExpertSignup from "../pages/ExpertSignup";
import EmailVerification from "../helpers/EmailVerification";
import ExpertDashboard from "../pages/ExpertDashboard";
import ExpertProfile from "../pages/ExpertProfile";
import ExpertAvailability from "../pages/ExpertAvailability";
import ExpertUpcomingMeetings from "../pages/ExpertUpcomingMeetings";
import ExpertPastMeetings from "../pages/ExpertPastMeetings";
import SubAdminManager from "../pages/SubAdminManager";
import RescheduleBookingPage from "../pages/RescheduleBookingPage";

const router = createBrowserRouter([
    {
        path: '/',
        element: <App />,
        children: [
            {
                path: '',
                element: <Login />,
            },
            {
                path: '/login',
                element: <Login />,
            },
            {
                path: '/signup',
                element: <Signup />,
            },
            {
                path:'expert-login',
                element: <ExpertLogin />,
            },
            {
                path:'expert-signup',
                element: <ExpertSignup />,
            },
            {
                path:'email-verification',
                element: <EmailVerification />,
            },
            {
                path:'/expert-dashboard',
                element: <ExpertDashboard />,
                children: [
                    {
                        path: 'profile',
                        element: <ExpertProfile />,
                    },
                    {
                        path:'availability',
                        element: <ExpertAvailability />,
                    },
                    {
                        path:'upcoming-bookings',
                        element:<ExpertUpcomingMeetings/>
                    },
                    {
                        path:'bookings',
                        element:<ExpertPastMeetings/>
                    }
                ]
            },
            {
                path: '/dashboard',
                element: <Dashboard />,
                children: [
                    {
                        path: 'home',
                        element: <Welcome />,
                    },
                    {
                        path:'upcoming-meetings/bookings/reschedule/:bookingId',
                        element:<RescheduleBookingPage/>
                    },
                    {
                        path:'edit-profile',
                        element: <EditProfile />,
                    },
                    {
                        path:'book-therapy',
                        element:<TherapyBooking/>
                    },
                    {
                        path:'cart',
                        element:<CartPage/>
                    },
                    {
                        path:'upcoming-meetings',
                        element:<UpcomingMeetingsPage/>
                    },
                    {
                        path:'all-orders',
                        element:<AllOrdersPage/>
                    },
                    
                ],
            },{
                path:'meeting/:bookingId',
                element:<MeetingPage/>
            },
            {
                path: 'admin-dashboard',
                element: <AdminDashboard />,
                children:[
                    {
                        path: 'users',
                        element: <UserManagement/>,
                    },
                    {
                        path: 'timeslots',
                        element: <TimeslotManager/>
                    },
                    {
                        path: 'therapy-manager',
                        element:<TherapyManager/>
                    },
                    {
                        path:'add-expert',
                        element:<AddTherapist/>
                    },
                    {
                        path: 'upcoming',
                        element: <AdminUpcomingBookingsPage/>
                    },
                    {
                        path: 'all-bookings',
                        element: <AdminAllBookingsPage/>
                    },
                    {
                        path: 'bookings/detail/:bookingId',
                        element: <AdminBookingDetailPage/>
                    },
                    {
                        path:'bookings/reschedule/:bookingId',
                        element:<RescheduleBookingPage/>
                    }
                    ,
                    {
                        path: 'create-bookings',
                        element: <AdminCreateBookingPage/>
                    },
                    {
                        path:'subadmin-manager',
                        element:<SubAdminManager/>
                    }
                    
                ]
            }
        ],
    },
]);

export default router;
