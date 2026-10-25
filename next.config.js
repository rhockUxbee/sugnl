/** @type {import('next').NextConfig} */
const nextConfig = {
	// The mailer embeds the logo from disk; public/ is not bundled into serverless functions by default.
	outputFileTracingIncludes: {
		"/api/newsletter/subscribe": ["./public/sugnl-logo.png"],
	},
	images: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: "images.unsplash.com",
			},
		],
	},
};

module.exports = nextConfig;
