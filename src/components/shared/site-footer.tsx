import Link from "next/link";
import { BrandLogo } from "@/components/shared/brand-logo";

export function SiteFooter() {
    return (
        <footer className="bg-[#17261F] py-12 border-t border-[#2B4338] text-white">
            <div className="max-w-7xl mx-auto px-6 lg:px-12 grid grid-cols-1 md:grid-cols-4 gap-8">
                <div className="md:col-span-2 flex flex-col gap-2">
                    <Link href="/" aria-label="K12Gig home" className="w-fit">
                        <BrandLogo inverse />
                    </Link>
                    <p className="text-sm text-white/60">Where educators grow and districts hire with clarity.</p>
                </div>
                
                <div className="flex flex-col gap-4">
                    <h4 className="text-sm font-semibold text-white/40 uppercase tracking-wider">Explore</h4>
                    <Link href="/browse" className="text-sm text-white/70 hover:text-white">Browse Educators</Link>
                    <Link href="/post" className="text-sm text-white/70 hover:text-white">Post a Need (districts)</Link>
                    <Link href="/#for-districts" className="text-sm text-white/70 hover:text-white">How Districts Hire</Link>
                    <Link href="/#for-educators" className="text-sm text-white/70 hover:text-white">For Educators</Link>
                    <Link href="/login" className="text-sm text-white/80 hover:text-white font-semibold">Sign in</Link>
                </div>
                
                <div className="flex flex-col gap-4">
                    <h4 className="text-sm font-semibold text-white/40 uppercase tracking-wider">Company</h4>
                    <Link href="/about" className="text-sm text-white/70 hover:text-white">About</Link>
                    <Link href="/pricing" className="text-sm text-white/70 hover:text-white">Pricing</Link>
                    <Link href="/help" className="text-sm text-white/70 hover:text-white">Help</Link>
                    <Link href="/dpa" className="text-sm text-white/70 hover:text-white">District DPA</Link>
                    <Link href="/privacy" className="text-sm text-white/70 hover:text-white">Privacy Policy</Link>
                    <Link href="/terms" className="text-sm text-white/70 hover:text-white">Terms of Service</Link>
                </div>
            </div>
            
            <div className="max-w-7xl mx-auto px-6 lg:px-12 mt-12 pt-8 border-t border-white/10 text-center md:text-left flex flex-col md:flex-row justify-between items-center gap-4">
                <p className="text-sm text-white/50">&copy; {new Date().getFullYear()} K12Gig Inc. All rights reserved.</p>
            </div>
        </footer>
    );
}
