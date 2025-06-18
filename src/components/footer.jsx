import Link from "next/link"

const Footer = () => {
    return (
        <footer className="bg-gray-100 text-gray-600 py-8 mt-20">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center text-sm">
                <p className="mb-4 md:mb-0">© {new Date().getFullYear()} AuditVerify. All rights reserved.</p>
                <div className="flex gap-4">
                    <Link href="/" className="hover:text-gray-900 transition">Privacy</Link>
                    <Link href="/" className="hover:text-gray-900 transition">Terms</Link>
                    <Link href="mailto:mihirjataniya1612@gmail.com" className="hover:text-gray-900 transition">Contact</Link>
                </div>
            </div>
        </footer>

    )
}

export default Footer
