import { Anchor, List, Text as MantineText } from "@mantine/core";
import { Link } from "react-router-dom";
import HollyIcon from "Components/Common/FestiveIcons/HollyIcon";
import BulletList from "Components/Common/BulletList";
import { ContactLink, LegalPage, LegalSection } from "Components/Legal/LegalPage";

export default function TermsPage() {
	return (
		<LegalPage title="Terms" icon={<HollyIcon />}>
			<MantineText>
				Secret Santa is a free app I run for family and friends. By using it, you agree to these few ground rules.
			</MantineText>

			<LegalSection title="Using the app">
				<BulletList>
					<List.Item>
						You need to be 13 or older to have an account. Kids can be added by their parents instead.
					</List.Item>
					<List.Item>Keep your password to yourself, and only use your own account.</List.Item>
					<List.Item>
						Be kind. No harassment, spam or anything illegal, including in Santa chats, and no trying to peek at who
						drew whom or to break the site.
					</List.Item>
					<List.Item>I may remove accounts or content that break these rules.</List.Item>
				</BulletList>
			</LegalSection>

			<LegalSection title="Your stuff">
				<MantineText>
					What you add (your wishlist, notes, messages) is yours. You let the app store it and show it to the people in
					your groups so it can do its job. See the{" "}
					<Anchor component={Link} to="/privacy">
						Privacy page
					</Anchor>{" "}
					for exactly who sees what.
				</MantineText>
			</LegalSection>

			<LegalSection title="Shopping">
				<MantineText>
					Links on wishlists go to other websites. Prices and pictures can be out of date, and anything you buy is
					between you and the store.
				</MantineText>
			</LegalSection>

			<LegalSection title="No guarantees">
				<MantineText>
					The app is provided as it is, for fun, with no promises that it&apos;s always available or free of mistakes. I
					may change it or shut it down at any time. As far as the law allows, I&apos;m not responsible for any loss
					from using it, including a gift that doesn&apos;t arrive in time.
				</MantineText>
			</LegalSection>

			<LegalSection title="Changes and questions">
				<MantineText>
					I may change these terms; the date at the top shows when. Questions? Email me at <ContactLink />.
				</MantineText>
			</LegalSection>
		</LegalPage>
	);
}
