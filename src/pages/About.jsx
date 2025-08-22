import React from 'react';
import { Heart, Users, Sparkles, Award } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

const About = () => {
  return (
    <>
      <Helmet>
        <title>About Us - JoyfulFinds</title>
        <meta name="description" content="Learn about JoyfulFinds - our story, values, and mission to spread joy through carefully curated products." />
      </Helmet>
      <div className="min-h-screen bg-gray-50 pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            About <span className="bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">Joy Store</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            We believe that happiness should be accessible to everyone. Our mission is to curate and create products that bring genuine joy to your everyday life.
          </p>
        </div>

        {/* Story Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 mb-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Story</h2>
              <p className="text-gray-600 leading-relaxed mb-6">
                Joy Store was born from a simple belief: that small, beautiful things can make a big difference in how we feel each day. Founded in 2024, we started with a mission to find and create products that don't just serve a function, but actually make people smile.
              </p>
              <p className="text-gray-600 leading-relaxed mb-6">
                Every product in our collection is carefully selected or designed with one question in mind: "Does this spark joy?" From the moment you unbox your order to years of daily use, we want our products to be a source of happiness in your life.
              </p>
              <p className="text-gray-600 leading-relaxed">
                Today, we're proud to serve thousands of customers worldwide, spreading positivity one package at a time.
              </p>
            </div>
            <div className="bg-gradient-to-br from-primary-50 to-secondary-50 rounded-xl p-8 text-center">
              <Sparkles className="h-16 w-16 text-accent-500 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Spreading Joy Since 2024</h3>
              <div className="space-y-2 text-gray-600">
                <p><strong>10,000+</strong> Happy Customers</p>
                <p><strong>50+</strong> Curated Products</p>
                <p><strong>99.5%</strong> Satisfaction Rate</p>
              </div>
            </div>
          </div>
        </div>

        {/* Values Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Our Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl p-8 text-center shadow-lg hover:shadow-xl transition-shadow duration-300">
              <Heart className="h-12 w-12 text-primary-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-4">Joy First</h3>
              <p className="text-gray-600">
                Every decision we make is filtered through one simple question: will this bring more joy to our customers' lives?
              </p>
            </div>
            <div className="bg-white rounded-xl p-8 text-center shadow-lg hover:shadow-xl transition-shadow duration-300">
              <Users className="h-12 w-12 text-secondary-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-4">Community</h3>
              <p className="text-gray-600">
                We're not just selling products; we're building a community of people who believe in the power of positivity.
              </p>
            </div>
            <div className="bg-white rounded-xl p-8 text-center shadow-lg hover:shadow-xl transition-shadow duration-300">
              <Award className="h-12 w-12 text-accent-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-4">Quality</h3>
              <p className="text-gray-600">
                Beautiful products should also be well-made. We never compromise on quality or craftsmanship.
              </p>
            </div>
          </div>
        </div>

        {/* Team Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Meet Our Team</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-32 h-32 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-white text-3xl font-bold">A</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Alex Chen</h3>
              <p className="text-primary-600 font-medium mb-2">Founder & Chief Joy Officer</p>
              <p className="text-gray-600 text-sm">
                Passionate about design and positive psychology, Alex founded Joy Store to make happiness more accessible.
              </p>
            </div>
            <div className="text-center">
              <div className="w-32 h-32 bg-gradient-to-br from-secondary-400 to-secondary-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-white text-3xl font-bold">S</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Sarah Johnson</h3>
              <p className="text-secondary-600 font-medium mb-2">Product Curator</p>
              <p className="text-gray-600 text-sm">
                With an eye for beautiful, functional design, Sarah ensures every product meets our joy standards.
              </p>
            </div>
            <div className="text-center">
              <div className="w-32 h-32 bg-gradient-to-br from-accent-400 to-accent-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-white text-3xl font-bold">M</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Marcus Rodriguez</h3>
              <p className="text-accent-600 font-medium mb-2">Customer Happiness Lead</p>
              <p className="text-gray-600 text-sm">
                Marcus makes sure every customer interaction is as delightful as our products themselves.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default About;
