'use client';

import { use, useState, useEffect } from 'react';
import ServiceDetails from '@/components/service/ServiceDetails';
import { Header } from '@/components/layout/Header';

// Mock Data Generation
const MOCK_SERVICES = [
    {
        id: '1',
        provider: {
            name: "Sarah Jenkins",
            avatarUrl: "https://i.pravatar.cc/150?u=a042581f4e29026704d",
            isOnline: true,
            location: "New York, USA",
            languages: ["English", "Spanish"],
            memberSince: "Dec 2021"
        },
        rating: 4.9,
        reviewCount: 128,
        hires: 450,
        description: "I will write SEO optimized blog posts and articles for your website to drive traffic and engagement.",
        title: "I will write SEO optimized blog posts",
        galleryUrls: [
            "https://images.unsplash.com/photo-1499750310159-529800cf2c5a?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
            "https://images.unsplash.com/photo-1455390582262-044cdead277a?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
            "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
        ],
        bio: "Hi! I'm Sarah, a professional content writer with over 5 years of experience. I specialize in creating engaging, SEO-friendly content that helps businesses grow. My work has been featured in top publications.",
        skills: ["Content Writing", "SEO", "Blog Posts", "Article Writing", "Copywriting"],
        expertise: "I have extensive experience in tech, lifestyle, and business niches. I know how to craft headlines that click and content that converts.",
        price: "45",
        priceRange: "$45 - $150",
        workingHours: {
            responseTime: "1 hour",
            schedule: [
                { day: "Mon - Fri", hours: "9:00 AM - 6:00 PM EST" },
                { day: "Sat", hours: "10:00 AM - 2:00 PM EST" }
            ]
        },
        paymentMethods: ["I accept payments via Visa, Mastercard, and PayPal."],
        yearsExperience: 5,
        reviewsList: [
            { id: 'r1', userName: 'John Doe', rating: 5, comment: 'Excellent work! Sarah delivered exactly what I needed ahead of schedule.', date: '2 days ago' },
            { id: 'r2', userName: 'Emily Smith', rating: 4, comment: 'Great quality content, very responsive.', date: '1 week ago' }
        ]
    },
    {
        id: '2',
        title: "I will design a modern logo for your business",
        description: "Professional logo design services to give your brand a unique identity.",
        price: "80",
        rating: 5.0,
        reviewCount: 42,
        thumbnailUrl: "https://images.unsplash.com/photo-1626785774573-4b79931229ea?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
        provider: {
            name: "David Lee",
            avatarUrl: "https://i.pravatar.cc/150?u=a042581f4e29026024d",
            location: "London, UK",
            isOnline: false
        }
    },
    {
        id: '3',
        title: "I will build a responsive website",
        description: "Full stack web development using React and Node.js.",
        price: "1200",
        rating: 4.8,
        reviewCount: 15,
        thumbnailUrl: "https://images.unsplash.com/photo-1547658719-da2b51169166?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
        provider: {
            name: "Tech Solutions",
            avatarUrl: "https://i.pravatar.cc/150?u=a042581f4e29026703d",
            location: "San Francisco, USA",
            isOnline: true
        }
    }
];

export default function ServicePage({ params }) {
    // Use React.use() to unwrap params in Next.js 15+ (if applicable) or access directly.
    // Assuming Next.js 13/14 App Router behavior where params is a promise in newer versions or object in older.
    // To be safe and compatible with recent updates, let's treat it as potentially async.
    const unwrappedParams = use(params);
    const id = unwrappedParams.id;

    // Find service or default to first one for demo if not found
    const service = MOCK_SERVICES.find(s => s.id === id) || MOCK_SERVICES[0];

    // Mock More Services (exclude current)
    const moreServices = MOCK_SERVICES.filter(s => s.id !== service.id);

    const handleNavigateToService = (s) => {
        // Should navigate to that service's page
        window.location.href = `/service/${s.id}`;
    };

    const handleContact = () => {
        console.log("Contact provider initiated");
    };

    return (
        <div className="min-h-screen bg-[#f8faff]">
            <Header />
            <ServiceDetails
                service={service}
                moreServices={moreServices}
                onNavigateToService={handleNavigateToService}
                onContact={handleContact}
            />
        </div>
    );
}
