import { List, Text as MantineText } from "@mantine/core";
import WreathIcon from "Components/Common/FestiveIcons/WreathIcon";
import BulletList from "Components/Common/BulletList";
import { ContactLink, LegalPage, LegalSection } from "Components/Legal/LegalPage";

export default function PrivacyPage() {
	return (
		<LegalPage title="Privacy" icon={<WreathIcon />}>
			<MantineText>
				I run Secret Santa, for free, so family and friends can draw names and share wishlists. There are no ads and no
				tracking, and I never sell or share anything for marketing. Here&apos;s exactly what the app keeps, and why.
			</MantineText>

			<LegalSection title="What it keeps">
				<BulletList>
					<List.Item>
						<strong>Your account:</strong> your first and last name, email address, password (stored scrambled, so
						nobody can read it) and which emails you want.
					</List.Item>
					<List.Item>
						<strong>Wishlists:</strong> each item&apos;s name, link, price, notes, picture link, how much you want it,
						and when you got it.
					</List.Item>
					<List.Item>
						<strong>Shopping:</strong> what you&apos;ve claimed or bought, gift ideas you suggest, and nudges.
					</List.Item>
					<List.Item>
						<strong>Groups:</strong> group names, notes, exchange dates and budgets, who&apos;s in each group,
						exclusions, and who drew whom.
					</List.Item>
					<List.Item>
						<strong>Santa chats:</strong> the messages you send.
					</List.Item>
					<List.Item>
						<strong>Kids and pets:</strong> the names and wishlists their parents add. They don&apos;t have logins and
						never enter anything themselves.
					</List.Item>
					<List.Item>
						<strong>Your general region:</strong> just your country and state or province, for the site&apos;s visitor
						stats, worked out on the server from your internet address at most once a day. Your internet address never
						leaves the server (see server records below).
					</List.Item>
					<List.Item>
						<strong>On your device:</strong> only what the app needs to work: a cookie that keeps you logged in (for up
						to a week), a security cookie that protects your forms, and a couple of preferences such as light or dark
						mode. No tracking or advertising cookies.
					</List.Item>
					<List.Item>
						<strong>Server records:</strong> like most websites, the server notes your internet address and browser with
						your login (for up to a week) and in its request log (for up to about three months), to keep things secure
						and fix problems. These stay on the server.
					</List.Item>
				</BulletList>
			</LegalSection>

			<LegalSection title="Who sees what">
				<BulletList>
					<List.Item>People in your groups see your name and your wishlist.</List.Item>
					<List.Item>You never see what&apos;s been claimed on your own list, so your gifts stay a surprise.</List.Item>
					<List.Item>
						Your Secret Santa stays anonymous, including in Santa chats. A group&apos;s owner can look up the full draw
						for their group, but can&apos;t read anyone&apos;s chats.
					</List.Item>
					<List.Item>
						I can reach the stored data to keep things working and fix problems, and I don&apos;t look at it otherwise.
					</List.Item>
				</BulletList>
			</LegalSection>

			<LegalSection title="Other services it uses">
				<BulletList>
					<List.Item>The site runs on Oracle Cloud, on a server in Chicago, USA.</List.Item>
					<List.Item>
						Emails go out through Gmail, so Google handles your email address and the messages. You can turn most emails
						off in Settings.
					</List.Item>
					<List.Item>
						Your browser loads the app&apos;s fonts from Google Fonts, and product pictures straight from the
						shop&apos;s website, so those sites see your internet address.
					</List.Item>
					<List.Item>
						When you press Fetch on a link, the server visits that shop page to read the item&apos;s name, price and
						picture.
					</List.Item>
				</BulletList>
			</LegalSection>

			<LegalSection title="How long it's kept">
				<MantineText>
					Everything stays while you have an account. Deleting your account (in Settings) removes it, your wishlist and
					your claims, and any groups you own are deleted for everyone. The server keeps backup copies, locked away so
					only I can open them: one each night for two weeks, plus one made just before each update to the app.
				</MantineText>
			</LegalSection>

			<LegalSection title="Children">
				<MantineText>
					Kids show up only as profiles their parents create. Children under 13 shouldn&apos;t sign up for their own
					account; if one has, email me and I&apos;ll delete it.
				</MantineText>
			</LegalSection>

			<LegalSection title="Changes and questions">
				<MantineText>
					If I change this page, the date at the top will change too. Questions, or want your data deleted? Email me at{" "}
					<ContactLink />.
				</MantineText>
			</LegalSection>
		</LegalPage>
	);
}
