import {
  Button,
  Center,
  Group,
  Loader,
  Modal,
  Pagination,
  Popover,
  Progress,
  SimpleGrid,
  Table,
  Text,
  Title,
} from "@mantine/core"; 
import { useMediaQuery } from "@mantine/hooks";
import { openConfirmModal } from "@mantine/modals";
import moment from "moment";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Adjustments, Ban, Check, Clock, Edit, Trash, Refresh, Plus } from "tabler-icons-react";

import { deleteJob, deleteUser, fetchJobList, fetchSiteSettings, fetchUserList } from "../../actions/utilActions";
import { ModalUserEdit } from "../../components/modals/ModalUserEdit";
import { useAppDispatch, useAppSelector } from "../../store/store";
import { SiteSettings } from "./SiteSettings";

export const AdminPage = () => {
  const dispatch = useAppDispatch();
  const auth = useAppSelector(state => state.auth);
  const fetchingUserList = useAppSelector(state => state.util.fetchingUserList);
  const { t } = useTranslation();

  useEffect(() => {
    if (auth.access.is_admin) {
      fetchSiteSettings(dispatch);
      dispatch(fetchJobList());
      dispatch(fetchUserList());
    }
  }, [auth.access, dispatch]);

  if (!auth.access.is_admin) {
    return <div>Unauthorized</div>;
  }

  return (
    <SimpleGrid cols={1} spacing="xl">
      <Group spacing="xs">
        <Adjustments size={35} />
        <Title order={2}>{t("adminarea.header")}</Title>
      </Group>
      <Title order={3}>{t("adminarea.sitesettings")}</Title>
      <SiteSettings />
      <Title order={3}>
        {t("adminarea.users")}
        {fetchingUserList ? <Loader size="xs" /> : null}
      </Title>
      
      <UserTable />
      <JobList />
    </SimpleGrid>
  );
};

const UserTable = () => {
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState({});
  const [createNewUser, setCreateNewUser] = useState(false);

  const dispatch = useAppDispatch();
  const userList = useAppSelector(state => state.util.userList);

  const matches = useMediaQuery("(min-width: 700px)");
  const { t } = useTranslation();

  useEffect(() => {
    dispatch(fetchUserList());
  }, [dispatch]);

  const rows = userList.map((user) => (
    <tr key={user.id}>
      <td>
        <Button 
          size="xs" 
          variant="subtle" 
          compact 
          title="Modify"
          leftIcon={<Edit />}
          onClick={() => {
            setUserToEdit(user);
            setCreateNewUser(false);
            setUserModalOpen(true);
          }}
        />
        
        <Button 
          size="xs" 
          variant="subtle" 
          color="red" 
          compact 
          disabled={user.is_superuser}
          title={user.is_superuser ? "Cannot delete admin user": "Delete"}
          leftIcon={<Trash />}
          onClick={() => {
            confirmDeleteUserModal(user, dispatch);
          }}
        />
      </td>
      <td>{user.username}</td>
      <td>
          {user.scan_directory ? user.scan_directory : t("adminarea.notset")}
      </td>
      {matches && <td>{user.confidence ? user.confidence : t("adminarea.notset")}</td>}
      {matches && <td>{user.photo_count}</td>}
      {matches && <td>{moment(user.date_joined).fromNow()}</td>}
    </tr>
  ));

  return (
    <>
      <Table striped highlightOnHover>
        <thead>
          <tr>
            <th>Add/Modify/Delete</th>
            <th>{t("adminarea.username")}</th>
            <th>{t("adminarea.scandirectory")}</th>
            {matches && <th>{t("adminarea.minimumconfidence")}</th>}
            {matches && <th>{t("adminarea.photocount")}</th>}
            {matches && <th>{t("adminarea.joined")}</th>}
          </tr>
        </thead>
        <tbody>
          {rows}
          <tr>
            <td>
              <Button
                size="sm"
                color="green"
                leftIcon={<Plus />}
                onClick={() => {
                  setCreateNewUser(true);
                  setUserToEdit({});
                  setUserModalOpen(true);
                }}
              >
                Add New User
              </Button>
            </td>
          </tr>
        </tbody>
      </Table>

      <ModalUserEdit
        onRequestClose={() => {
          setUserModalOpen(false);
          dispatch(fetchUserList());
        }}
        userToEdit={userToEdit}
        userList={userList}
        isOpen={userModalOpen}
        createNew={createNewUser}
      />

    </>
  );
}

const confirmDeleteUserModal = (user, dispatch) =>  openConfirmModal({
  title: (
    <Title>Please confirm your action</Title>
  ),
  children: (
    <Text size="sm">
      This action is so important that you are required to confirm it with a modal. Please click
      one of these buttons to proceed.
    </Text>
  ),
  labels: { confirm: 'Accept', cancel: 'Cancel' },
  onConfirm: () => {
    const id = user.id;
    const username = user.username;
    deleteUser({id: id, username: username}, dispatch);
    dispatch(fetchUserList());
  },
  onCancel: () => {
  }
});

export const DeleteButton = job => {
  const [opened, setOpened] = useState(false);
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  const id = job.job.id;
  const page = job.activePage;
  const pageSize = job.pageSize;

  return (
    <Popover
      opened={opened}
      position="top"
      placement="center"
      withArrow
      width={260}
      onClose={() => setOpened(false)}
      target={
        <Button
          onMouseEnter={() => setOpened(true)}
          onMouseLeave={() => setOpened(false)}
          onClick={() => {
            dispatch(deleteJob(id, page, pageSize));
          }}
          color="red"
        >
          {t("adminarea.remove")}
        </Button>
      }
    >
        <div style={{ display: "flex" }}>{t("joblist.removeexplanation")}</div>
    </Popover>
  );
};

export const JobList = () => {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const { jobList, jobCount, fetchingJobList } = useAppSelector(state => state.util);
  const [page, setPage] = useState(1);
  const [activePage, setActivePage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const matches = useMediaQuery("(min-width: 700px)");
  const auth = useAppSelector(state => state.auth);
  //fetch job every two seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (auth.access.is_admin) {
        dispatch(fetchJobList(activePage, pageSize));
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [auth.access, activePage, pageSize, dispatch]);

  return (
    <SimpleGrid cols={1} spacing="xl">
      <Title order={3}>
        {t("joblist.workerlogs")} {fetchingJobList ? <Loader size="xs" /> : null}
      </Title>
      <Table striped highlightOnHover>
        <thead>
          <tr>
            <th> {t("joblist.status")}</th>
            <th> {t("joblist.jobtype")}</th>
            <th> {t("joblist.progress")}</th>
            {matches && <th> {t("joblist.queued")}</th>}
            {matches && <th> {t("joblist.started")}</th>}
            {matches && <th> {t("joblist.duration")}</th>}
            {matches && <th> {t("joblist.startedby")}</th>}
            <th> {t("joblist.delete")}</th>
          </tr>
        </thead>
        <tbody>
          {jobList.map(job => {
            const jobSuccess = job.finished && !job.failed;
            return (
              // error={job.failed} warning={!job.finished_at}
              <tr key={job.job_id}>
                <td>
                  {job.finished ? (
                    job.failed ? (
                      <Ban color="red" />
                    ) : (
                      <Check color="green" />
                    )
                  ) : job.started_at ? (
                    <Refresh color="yellow" />
                  ) : (
                    <Clock color="blue" />
                  )}
                </td>
                <td>{job.job_type_str}</td>
                <td>
                  {job.result.progress.target !== 0 && !job.finished ? (
                    <div>
                      <Progress
                        size={30}
                        value={(job.result.progress.current.toFixed(2) / job.result.progress.target) * 100}
                      ></Progress>
                      <Center>
                        {`${job.result.progress.current} ${t("joblist.itemsprocessed")} (${(
                          (job.result.progress.current.toFixed(2) / job.result.progress.target) *
                          100
                        ).toFixed(2)} %) `}
                      </Center>
                    </div>
                  ) : job.finished ? (
                    <div>
                      <Progress size={30} color={job.error ? "red" : "green"} value={100} />
                      <Center>{`${job.result.progress.current} ${t("joblist.itemsprocessed")} `}</Center>
                    </div>
                  ) : null}
                </td>
                {matches && <td>{moment(job.queued_at).fromNow()}</td>}
                {matches && <td>{job.started_at ? moment(job.started_at).fromNow() : ""}</td>}

                {matches && (
                  <td>
                    {job.finished
                      ? // @ts-ignore
                        moment.duration(moment(job.finished_at) - moment(job.started_at)).humanize()
                      : job.started_at
                      ? t("joblist.running")
                      : ""}
                  </td>
                )}
                {matches && <td>{job.started_by.username}</td>}
                <td>
                  <DeleteButton job={job}></DeleteButton>
                </td>
              </tr>
            );
          })}
        </tbody>
      </Table>
      <Pagination
        page={activePage}
        total={Math.ceil(jobCount.toFixed(1) / pageSize)}
        onChange={newPage => {
          //@ts-ignore
          setActivePage(newPage);
          dispatch(fetchJobList(newPage, pageSize));
        }}
      />
    </SimpleGrid>
  );
};
