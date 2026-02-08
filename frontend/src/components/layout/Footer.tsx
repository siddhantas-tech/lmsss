const Footer = () => {
    return (
        <footer className="border-t py-8 bg-gray-50">
            <div className="container mx-auto px-4 text-center text-gray-500 text-sm">
                &copy; {new Date().getFullYear()} LMS Platform. All rights reserved.
            </div>
        </footer>
    );
};

export default Footer;
