import LayoutProvider from "@/src/components/LayoutProvider"

export default function Page({ children }: { children: React.ReactNode }) {
  return (
        <LayoutProvider>
          {children}
        </LayoutProvider>   
  )
}
