import Link from "next/link";

export function SiteFooter() {
    return (
        <footer className="bg-[--bg-surface] py-12 border-t border-[--border-subtle]">
            <div className="max-w-7xl mx-auto px-6 lg:px-12 grid grid-cols-1 md:grid-cols-4 gap-8">
                <div className="md:col-span-2 flex flex-col gap-2">
                    <span className="font-heading text-2xl font-bold text-[--accent-primary] grayscale opacity-70">
                        EduGig
                    </span>
                    <p className="text-sm text-[--text-secondary]">Where educators grow.</p>
                </div>
                
                <div className="flex flex-col gap-4">
                    <h4 className="text-sm font-semibold text-[--text-tertiary] uppercase tracking-wider">Explore</h4>
                    <Link href="/browse" className="text-sm text-[--text-secondary] hover:text-[--text-primary]">Browse Educators</Link>
                    <Link href="/post" className="text-sm text-[--text-secondary] hover:text-[--text-primary]">Post a Need (districts)</Link>
                    <Link href="/#for-districts" className="text-sm text-[--text-secondary] hover:text-[--text-primary]">How It Works</Link>
                    <Link href="/login" className="text-sm text-[--text-secondary] hover:text-[--text-primary] font-semibold">Sign in</Link>
                </div>
                
                <div className="flex flex-col gap-4">
                    <h4 className="text-sm font-semibold text-[--text-tertiary] uppercase tracking-wider">Legal</h4>
                    <Link href="/privacy" className="text-sm text-[--text-secondary] hover:text-[--text-primary]">Privacy Policy</Link>
                    <Link href="/terms" className="text-sm text-[--text-secondary] hover:text-[--text-primary]">Terms of Service</Link>
                </div>
            </div>
            
            <div className="max-w-7xl mx-auto px-6 lg:px-12 mt-12 pt-8 border-t border-[--border-subtle] text-center md:text-left flex flex-col md:flex-row justify-between items-center gap-4">
                <p className="text-sm text-[--text-tertiary]">&copy; {new Date().getFullYear()} EduGig Inc. All rights reserved.</p>
            </div>
        </footer>
    );
}
