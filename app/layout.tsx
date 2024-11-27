import { ToastContainer } from "react-toastify";
import "./globals.css";

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<body className={`antialiased`}>
				{children}
				<ToastContainer />
			</body>
		</html>
	);
}
