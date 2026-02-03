import React from "react";
import Header from "./Header"; // Sử dụng lại Header của trang home
import Footer from "./Footer"; // Sử dụng lại Footer của trang home
import PropTypes from "prop-types";

const AuthLayout = ({ children, title }) => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-white">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8 flex items-center justify-center">
        <div className="w-full max-w-md">
          <div className="bg-gray-800 shadow-lg rounded-lg p-8">
            <h2 className="text-2xl font-bold text-center text-white mb-8">
              {title}
            </h2>
            {children}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

AuthLayout.propTypes = {
  children: PropTypes.node.isRequired,
  title: PropTypes.string.isRequired,
};

export default AuthLayout;
