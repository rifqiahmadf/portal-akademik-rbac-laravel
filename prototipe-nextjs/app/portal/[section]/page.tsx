import { PortalPage, sectionMetadata } from "../workspace";

type Props = { params: Promise<{ section: string }> };

export async function generateMetadata({ params }: Props) {
	return sectionMetadata((await params).section);
}

export default async function Page({ params }: Props) {
	return <PortalPage section={(await params).section} />;
}
