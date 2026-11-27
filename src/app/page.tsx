import CallToAction from "@/components/CallToAction";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import HowItWorks from "@/components/HowItWorks";
import Markets from "@/components/Markets";
import UpcomingWaves from "@/components/UpcomingWaves";
import WhyMainframe from "@/components/WhyMainframe";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <UpcomingWaves />
        <HowItWorks />
        <Markets />
        <WhyMainframe />
        <CallToAction />
      </main>
      <Footer />
    </>
  );
}
