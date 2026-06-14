import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Typography, typographyVariants } from "@/components/ui/typography"

export function SectionCards() {
  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Revenue</CardDescription>
          <CardTitle className={typographyVariants({ variant: "stat" })}>
            $1,250.00
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingUp />
              +12.5%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <Typography variant="label" className="line-clamp-1 flex gap-2">
            Trending up this month <IconTrendingUp className="size-4" />
          </Typography>
          <Typography variant="muted">
            Visitors for the last 6 months
          </Typography>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>New Customers</CardDescription>
          <CardTitle className={typographyVariants({ variant: "stat" })}>
            1,234
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingDown />
              -20%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <Typography variant="label" className="line-clamp-1 flex gap-2">
            Down 20% this period <IconTrendingDown className="size-4" />
          </Typography>
          <Typography variant="muted">
            Acquisition needs attention
          </Typography>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Active Accounts</CardDescription>
          <CardTitle className={typographyVariants({ variant: "stat" })}>
            45,678
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingUp />
              +12.5%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <Typography variant="label" className="line-clamp-1 flex gap-2">
            Strong user retention <IconTrendingUp className="size-4" />
          </Typography>
          <Typography variant="muted">Engagement exceed targets</Typography>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Growth Rate</CardDescription>
          <CardTitle className={typographyVariants({ variant: "stat" })}>
            4.5%
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingUp />
              +4.5%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <Typography variant="label" className="line-clamp-1 flex gap-2">
            Steady performance increase <IconTrendingUp className="size-4" />
          </Typography>
          <Typography variant="muted">Meets growth projections</Typography>
        </CardFooter>
      </Card>
    </div>
  )
}
