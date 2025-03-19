import {auth} from '@/app/auth'
import { redirect } from 'next/navigation';

export default async function Page() {
    const session = await auth();

    if (session && session.user){
        console.log(session.user);
        redirect('/Calendar');
    } 

    else redirect('/login');
}