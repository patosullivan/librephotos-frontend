import { ActionIcon, Button, Group, Menu, Modal, Popover, Stack, Text, TextInput, Title } from "@mantine/core";
import { useDisclosure, useViewportSize } from "@mantine/hooks";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { AutoSizer, Grid } from "react-virtualized";
import { Album, DotsVertical, Edit, Share, Trash, User, Users } from "tabler-icons-react";

import { deleteUserAlbum, fetchUserAlbumsList, renameUserAlbum } from "../../actions/albumsActions";
import { Tile } from "../../components/Tile";
import { ModalAlbumShare } from "../../components/sharing/ModalAlbumShare";
import { useAppDispatch, useAppSelector } from "../../store/store";
import { LEFT_MENU_WIDTH, TOP_MENU_HEIGHT } from "../../ui-constants";
import { HeaderComponent } from "./HeaderComponent";

const SIDEBAR_WIDTH = LEFT_MENU_WIDTH;

export function SharedWith({ album }: any) {
  const [opened, { toggle, close }] = useDisclosure(false);
  // To-Do: Figure out, why album is an array / json
  return (
    <Popover opened={opened} position="bottom" width={260} onClose={close}>
      <Popover.Target>
        <Users size={20} onClick={toggle} />
      </Popover.Target>
      <Popover.Dropdown>
        <Stack>
          <Title order={5}>Shared with:</Title>
          {album.shared_to.map((el: { username: string }) => (
            <Group key={el.username}>
              <User />
              <b>{el.username}</b>
            </Group>
          ))}
        </Stack>
      </Popover.Dropdown>
    </Popover>
  );
}

export function AlbumUser() {
  const { height } = useViewportSize();
  const [newAlbumTitle, setNewAlbumTitle] = useState("");
  const [albumID, setAlbumID] = useState("");
  const [albumTitle, setAlbumTitle] = useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);

  const [entrySquareSize, setEntrySquareSize] = useState(200);
  const [numEntrySquaresPerRow, setNumEntrySquaresPerRow] = useState(1);
  const dispatch = useAppDispatch();
  const { t } = useTranslation();

  const { albumsUserList, fetchingAlbumsUserList } = useAppSelector(store => store.albums);

  const openDeleteDialog = (id: string, title: string) => {
    setIsDeleteDialogOpen(true);
    setAlbumID(id);
    setAlbumTitle(title);
  };

  const openRenameDialog = (id: string, title: string) => {
    setIsRenameDialogOpen(true);
    setAlbumID(id);
    setAlbumTitle(title);
  };

  const openShareDialog = (id: string, title: string) => {
    setIsShareDialogOpen(true);
    setAlbumID(id);
    setAlbumTitle(title);
  };

  const closeDeleteDialog = () => setIsDeleteDialogOpen(false);

  const closeRenameDialog = () => setIsRenameDialogOpen(false);

  const closeShareDialog = () => setIsShareDialogOpen(false);

  const calculateEntrySquareSize = () => {
    let squaresPerRow = 6;
    if (window.innerWidth < 600) {
      squaresPerRow = 2;
    } else if (window.innerWidth < 800) {
      squaresPerRow = 3;
    } else if (window.innerWidth < 1000) {
      squaresPerRow = 4;
    } else if (window.innerWidth < 1200) {
      squaresPerRow = 5;
    }

    const columnWidth = window.innerWidth - SIDEBAR_WIDTH - 5 - 5 - 15;

    const squareSize = columnWidth / squaresPerRow;
    setEntrySquareSize(squareSize);
    setNumEntrySquaresPerRow(squaresPerRow);
  };

  useEffect(() => {
    calculateEntrySquareSize();
    if (albumsUserList.length === 0) {
      dispatch(fetchUserAlbumsList());
    }
  }, [albumsUserList.length, dispatch]);

  const cellRenderer = ({ columnIndex, key, rowIndex, style }) => {
    const albumUserIndex = rowIndex * numEntrySquaresPerRow + columnIndex;
    if (albumUserIndex < albumsUserList.length) {
      return (
        <div key={key} style={style}>
          <div style={{ padding: 5, height: entrySquareSize, width: entrySquareSize }}>
            <Link to={`/useralbum/${albumsUserList[albumUserIndex].id}`}>
              <Tile
                video={albumsUserList[albumUserIndex].cover_photo.video === true}
                height={entrySquareSize - 10}
                width={entrySquareSize - 10}
                image_hash={albumsUserList[albumUserIndex].cover_photo.image_hash}
              />
            </Link>

            <div style={{ position: "absolute", top: 10, right: 10 }}>
              <Menu position="bottom-end">
                <Menu.Target>
                  <ActionIcon>
                    <DotsVertical />
                  </ActionIcon>
                </Menu.Target>

                <Menu.Dropdown>
                  <Menu.Item
                    icon={<Edit />}
                    onClick={() =>
                      openRenameDialog(albumsUserList[albumUserIndex].id, albumsUserList[albumUserIndex].title)
                    }
                  >
                    {t("rename")}
                  </Menu.Item>
                  <Menu.Item
                    icon={<Share />}
                    onClick={() =>
                      openShareDialog(albumsUserList[albumUserIndex].id, albumsUserList[albumUserIndex].title)
                    }
                  >
                    {t("sidemenu.sharing")}
                  </Menu.Item>
                  <Menu.Item
                    icon={<Trash />}
                    onClick={() =>
                      openDeleteDialog(albumsUserList[albumUserIndex].id, albumsUserList[albumUserIndex].title)
                    }
                  >
                    {t("delete")}
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
            </div>
          </div>
          <div className="personCardName" style={{ paddingLeft: 15, paddingRight: 15, height: 50 }}>
            <Group>
              {albumsUserList[albumUserIndex].shared_to.length > 0 && (
                <SharedWith album={albumsUserList[albumUserIndex]} />
              )}
              <Text weight="bold" lineClamp={1}>
                {albumsUserList[albumUserIndex].title}
              </Text>
            </Group>
            {t("numberofphotos", {
              number: albumsUserList[albumUserIndex].photo_count,
            })}
          </div>
        </div>
      );
    }
    return <div key={key} style={style} />;
  };

  return (
    <div>
      <HeaderComponent
        icon={<Album size={50} />}
        title={t("myalbums")}
        fetching={fetchingAlbumsUserList}
        subtitle={t("useralbum.numberof", {
          number: albumsUserList.length,
        })}
      />
      <Modal size="mini" onClose={() => closeRenameDialog()} opened={isRenameDialogOpen}>
        <div style={{ padding: 20 }}>
          <Title order={4}>{t("useralbum.renamealbum")}</Title>

          <Group>
            <TextInput
              error={
                albumsUserList.map(el => el.title.toLowerCase().trim()).includes(newAlbumTitle.toLowerCase().trim()) ? (
                  <>
                    {t("useralbum.albumalreadyexists")}, {{ name: newAlbumTitle.trim() }}
                  </>
                ) : (
                  ""
                )
              }
              onChange={v => {
                setNewAlbumTitle(v.currentTarget.value);
              }}
              placeholder={t("useralbum.albumplaceholder")}
            />

            <Button
              color="green"
              onClick={() => {
                dispatch(renameUserAlbum(albumID, albumTitle, newAlbumTitle));
                closeRenameDialog();
              }}
              disabled={albumsUserList
                .map(el => el.title.toLowerCase().trim())
                .includes(newAlbumTitle.toLowerCase().trim())}
              type="submit"
            >
              {t("rename")}
            </Button>
          </Group>
        </div>
      </Modal>
      <ModalAlbumShare
        isOpen={isShareDialogOpen}
        onRequestClose={() => {
          closeShareDialog();
        }}
        albumID={albumID}
      />
      <Modal opened={isDeleteDialogOpen} onClose={() => closeDeleteDialog()}>
        <Stack>
          {t("deletefaceexplanation")}
          <Group position="center">
            <Button
              color="blue"
              onClick={() => {
                setIsDeleteDialogOpen(false);
              }}
            >
              {t("cancel")}
            </Button>
            <Button
              color="red"
              onClick={() => {
                dispatch(deleteUserAlbum(albumID, albumTitle));
                setIsDeleteDialogOpen(false);
              }}
            >
              {t("confirm")}
            </Button>
          </Group>
        </Stack>
      </Modal>
      <AutoSizer disableHeight style={{ outline: "none", padding: 0, margin: 0 }}>
        {({ width }) => (
          <Grid
            style={{ outline: "none" }}
            disableTitle={false}
            cellRenderer={cellRenderer}
            columnWidth={entrySquareSize}
            columnCount={numEntrySquaresPerRow}
            height={height - TOP_MENU_HEIGHT - 60}
            rowHeight={entrySquareSize + 60}
            rowCount={Math.ceil(albumsUserList.length / numEntrySquaresPerRow)}
            width={width}
          />
        )}
      </AutoSizer>
    </div>
  );
}
