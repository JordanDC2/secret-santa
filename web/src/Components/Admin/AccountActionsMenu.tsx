import { ActionIcon, Menu } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEllipsis, faKey, faPen, faTrashCan } from "@fortawesome/free-solid-svg-icons";
import type { IAdminAccount } from "Components/Admin/types";

export type IAccountAction = "edit" | "passwordReset" | "delete";

type IAccountActionsMenuProps = {
	account: IAdminAccount;
	onAction: (action: IAccountAction) => void;
};

export default function AccountActionsMenu({ account, onAction }: IAccountActionsMenuProps) {
	return (
		<Menu position="bottom-end" withinPortal>
			<Menu.Target>
				<ActionIcon variant="subtle" color="gray" aria-label={`Actions for ${account.fullName}`}>
					<FontAwesomeIcon icon={faEllipsis} />
				</ActionIcon>
			</Menu.Target>
			<Menu.Dropdown>
				<Menu.Item leftSection={<FontAwesomeIcon icon={faPen} fixedWidth />} onClick={() => onAction("edit")}>
					Edit name & email
				</Menu.Item>
				<Menu.Item leftSection={<FontAwesomeIcon icon={faKey} fixedWidth />} onClick={() => onAction("passwordReset")}>
					Send password reset link
				</Menu.Item>
				{/* Your own account is deleted from Settings, with your password. */}
				{!account.isAdmin && (
					<Menu.Item
						color="red"
						leftSection={<FontAwesomeIcon icon={faTrashCan} fixedWidth />}
						onClick={() => onAction("delete")}
					>
						Delete account
					</Menu.Item>
				)}
			</Menu.Dropdown>
		</Menu>
	);
}
